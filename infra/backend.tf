terraform {
  backend "s3" {
    bucket       = "mactidar-tfstate-831981619011"
    key          = "mactidar/terraform.tfstate"
    region       = "af-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
