locals {
  name = "mactidar"

  # Which table/bucket the app and workers use (see var.use_ireland_data).
  active = var.use_ireland_data ? {
    region      = var.data_region
    table_name  = module.database_ie.table_name
    table_arn   = module.database_ie.table_arn
    bucket_name = module.storage_ie.bucket_name
    bucket_arn  = module.storage_ie.bucket_arn
    } : {
    region      = var.legacy_data_region
    table_name  = module.database.table_name
    table_arn   = module.database.table_arn
    bucket_name = module.storage.bucket_name
    bucket_arn  = module.storage.bucket_arn
  }
}

module "dns" {
  source      = "./modules/dns"
  domain_name = var.domain_name
}

# Original data stores in af-south-1. Kept (read-only after cutover) until
# they're decommissioned.
module "database" {
  source = "./modules/database"
  name   = local.name
  region = var.legacy_data_region
}

module "storage" {
  source          = "./modules/storage"
  name            = local.name
  region          = var.legacy_data_region
  allowed_origins = ["https://${var.domain_name}", "http://localhost:3000"]
}

# New data stores next to the app.
module "database_ie" {
  source = "./modules/database"
  name   = local.name
  region = var.data_region
}

module "storage_ie" {
  source          = "./modules/storage"
  name            = local.name
  region          = var.data_region
  bucket_suffix   = "-ie"
  allowed_origins = ["https://${var.domain_name}", "http://localhost:3000"]
}

# The pre-workspaces TEAM/SETTINGS item was deleted from the table on
# 2026-10-17; stop managing it without trying to delete it again.
removed {
  from = module.database.aws_dynamodb_table_item.team_settings
  lifecycle {
    destroy = false
  }
}

module "auth" {
  source = "./modules/auth"
  name   = local.name
}

module "email" {
  source      = "./modules/email"
  name        = local.name
  domain_name = var.domain_name
  zone_id     = module.dns.zone_id
  alert_email = var.alert_email
}

module "hosting" {
  source              = "./modules/hosting"
  name                = local.name
  app_region          = var.app_region
  data_region         = local.active.region
  auth_region         = var.auth_region
  domain_name         = var.domain_name
  zone_id             = module.dns.zone_id
  repository          = var.github_repository
  access_token        = var.github_access_token
  production_branch   = var.production_branch
  table_arns          = [module.database.table_arn, module.database_ie.table_arn]
  table_name          = local.active.table_name
  bucket_arns         = [module.storage.bucket_arn, module.storage_ie.bucket_arn]
  bucket_name         = local.active.bucket_name
  user_pool_arn       = module.auth.user_pool_arn
  user_pool_id        = module.auth.user_pool_id
  user_pool_client_id = module.auth.client_id
  client_secret       = module.auth.client_secret
  ses_identity_arn    = module.email.identity_arn
  from_email          = module.email.from_email
  zip_function_arn    = module.workers.zip_function_arn
  zip_function_name   = module.workers.zip_function_name
}

module "workers" {
  source               = "./modules/workers"
  name                 = local.name
  region               = local.active.region
  topic_region         = var.auth_region
  table_name           = local.active.table_name
  table_arn            = local.active.table_arn
  bucket_name          = local.active.bucket_name
  bucket_arn           = local.active.bucket_arn
  ses_events_topic_arn = module.email.events_topic_arn
}

module "monitoring" {
  source             = "./modules/monitoring"
  name               = local.name
  alert_email        = var.alert_email
  monthly_budget_usd = var.monthly_budget_usd
}
