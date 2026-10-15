output "name_servers" {
  description = "Add these as NS records for host \"cloud\" in Namecheap (mactidar.com → Advanced DNS)."
  value       = module.dns.name_servers
}

output "app_url" {
  value = "https://${var.domain_name}"
}

output "amplify_default_domain" {
  value = module.hosting.default_domain
}

# Values for .env.local when running the app locally.
output "env" {
  value = {
    DATA_REGION          = var.data_region
    TABLE_NAME           = module.database.table_name
    FILES_BUCKET         = module.storage.bucket_name
    COGNITO_USER_POOL_ID = module.auth.user_pool_id
    COGNITO_CLIENT_ID    = module.auth.client_id
    SES_FROM_EMAIL       = module.email.from_email
    SSM_PREFIX           = module.hosting.ssm_prefix
  }
}
