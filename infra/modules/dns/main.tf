variable "domain_name" {
  type = string
}

resource "aws_route53_zone" "this" {
  name    = var.domain_name
  comment = "Delegated from Namecheap (zetca.com)"
}

output "zone_id" {
  value = aws_route53_zone.this.zone_id
}

output "name_servers" {
  value = aws_route53_zone.this.name_servers
}
