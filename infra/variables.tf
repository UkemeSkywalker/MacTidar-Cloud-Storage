variable "data_region" {
  description = "Region for S3, DynamoDB, Cognito, SES and Lambdas."
  type        = string
  default     = "af-south-1"
}

variable "app_region" {
  description = "Region for Amplify Hosting (the Next.js app)."
  type        = string
  default     = "eu-west-1"
}

variable "domain_name" {
  description = "Domain the app is served from. Delegated from Namecheap to Route 53."
  type        = string
  default     = "cloud.zetca.com"
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

variable "quota_gb" {
  description = "Initial team storage quota in GiB. Later changes are made by an admin in the app."
  type        = number
  default     = 15
}

variable "max_file_gb" {
  description = "Initial maximum size of a single upload in GiB."
  type        = number
  default     = 5
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
