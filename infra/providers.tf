# The provider default is the auth region (Cognito, SES, SSM). Data resources
# and Amplify set `region` per resource (AWS provider 6.x).
provider "aws" {
  region = var.auth_region
  default_tags {
    tags = {
      Project   = "mactidar"
      ManagedBy = "terraform"
    }
  }
}
