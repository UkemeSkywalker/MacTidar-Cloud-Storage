variable "domain_name" {
  type = string
}

resource "aws_route53_zone" "this" {
  name    = var.domain_name
  comment = "Delegated from Namecheap (mactidar.com)"

  # Amplify adds its own records (app alias, certificate validation) that
  # Terraform doesn't track; allow the zone to be removed anyway.
  force_destroy = true
}

output "zone_id" {
  value = aws_route53_zone.this.zone_id
}

output "name_servers" {
  value = aws_route53_zone.this.name_servers
}
