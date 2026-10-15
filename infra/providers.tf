# Data and back-end services live in Cape Town. Amplify resources set
# `region = var.app_region` per resource (AWS provider 6.x), because Amplify
# Hosting isn't available in af-south-1.
provider "aws" {
  region = var.data_region
  default_tags {
    tags = {
      Project   = "mactidar"
      ManagedBy = "terraform"
    }
  }
}
