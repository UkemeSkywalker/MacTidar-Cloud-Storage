variable "data_region" {
  description = "Region for S3, DynamoDB and the Lambda workers (next to the app)."
  type        = string
  default     = "eu-west-1"
}

variable "auth_region" {
  description = "Region for Cognito, SES, SSM secrets and the provider default. Stays put: moving Cognito would force password resets."
  type        = string
  default     = "af-south-1"
}

variable "legacy_data_region" {
  description = "Where the data lived before the move. The old table and bucket stay here until they're decommissioned."
  type        = string
  default     = "af-south-1"
}

variable "use_ireland_data" {
  description = "Cutover switch: false = app and workers use the old af-south-1 table/bucket; true = the new data_region ones."
  type        = bool
  default     = false
}

variable "app_region" {
  description = "Region for Amplify Hosting (the Next.js app)."
  type        = string
  default     = "eu-west-1"
}

variable "domain_name" {
  description = "Domain the app is served from. Delegated from Namecheap to Route 53."
  type        = string
  default     = "cloud.mactidar.com"
}

variable "github_repository" {
  description = "GitHub repository Amplify builds from."
  type        = string
  default     = "https://github.com/UkemeSkywalker/MacTidar-Cloud-Storage"
}

variable "github_access_token" {
  description = "GitHub fine-grained token Amplify uses to connect to the repository (only needed when the app is first created)."
  type        = string
  sensitive   = true
}

variable "production_branch" {
  description = "Git branch Amplify deploys."
  type        = string
  default     = "master"
}

variable "alert_email" {
  description = "Email address that receives AWS budget alerts."
  type        = string
}

variable "monthly_budget_usd" {
  description = "Monthly cost alert threshold in USD."
  type        = number
  default     = 15
}
