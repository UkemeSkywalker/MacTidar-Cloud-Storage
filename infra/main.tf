locals {
  name = "mactidar"
}

module "dns" {
  source      = "./modules/dns"
  domain_name = var.domain_name
}

module "database" {
  source         = "./modules/database"
  name           = local.name
  quota_bytes    = var.quota_gb * 1024 * 1024 * 1024
  max_file_bytes = var.max_file_gb * 1024 * 1024 * 1024
}

module "storage" {
  source          = "./modules/storage"
  name            = local.name
  allowed_origins = ["https://${var.domain_name}", "http://localhost:3000"]
}

module "auth" {
  source = "./modules/auth"
  name   = local.name
}

module "email" {
  source      = "./modules/email"
  domain_name = var.domain_name
  zone_id     = module.dns.zone_id
}

module "hosting" {
  source              = "./modules/hosting"
  name                = local.name
  app_region          = var.app_region
  data_region         = var.data_region
  domain_name         = var.domain_name
  zone_id             = module.dns.zone_id
  repository          = var.github_repository
  access_token        = var.github_access_token
  production_branch   = var.production_branch
  table_arn           = module.database.table_arn
  table_name          = module.database.table_name
  bucket_arn          = module.storage.bucket_arn
  bucket_name         = module.storage.bucket_name
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
  source      = "./modules/workers"
  name        = local.name
  table_name  = module.database.table_name
  table_arn   = module.database.table_arn
  bucket_name = module.storage.bucket_name
  bucket_arn  = module.storage.bucket_arn
}

module "monitoring" {
  source             = "./modules/monitoring"
  name               = local.name
  alert_email        = var.alert_email
  monthly_budget_usd = var.monthly_budget_usd
}
