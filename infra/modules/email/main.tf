# SES domain identity for cloud.mactidar.com with DKIM, SPF and DMARC.

variable "domain_name" {
  type = string
}

variable "zone_id" {
  type = string
}

resource "aws_sesv2_email_identity" "this" {
  email_identity = var.domain_name
}

resource "aws_route53_record" "dkim" {
  count   = 3
  zone_id = var.zone_id
  name    = "${aws_sesv2_email_identity.this.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 1800
  records = ["${aws_sesv2_email_identity.this.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_route53_record" "spf" {
  zone_id = var.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "dmarc" {
  zone_id = var.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 3600
  records = ["v=DMARC1; p=quarantine; adkim=s; aspf=r"]
}

output "identity_arn" {
  value = aws_sesv2_email_identity.this.arn
}

output "from_email" {
  value = "no-reply@${var.domain_name}"
}
