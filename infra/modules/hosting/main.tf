# Next.js on Amplify Hosting in eu-west-1, talking to data services in
# af-south-1 through an IAM compute role. See docs/architecture.md §2.

variable "name" { type = string }
variable "app_region" { type = string }
variable "data_region" { type = string }
variable "domain_name" { type = string }
variable "zone_id" { type = string }
variable "repository" { type = string }
variable "production_branch" { type = string }
variable "table_arn" { type = string }
variable "table_name" { type = string }
variable "bucket_arn" { type = string }
variable "bucket_name" { type = string }
variable "user_pool_arn" { type = string }
variable "user_pool_id" { type = string }
variable "user_pool_client_id" { type = string }
variable "ses_identity_arn" { type = string }
variable "from_email" { type = string }
variable "zip_function_arn" { type = string }
variable "zip_function_name" { type = string }

variable "access_token" {
  type      = string
  sensitive = true
}

variable "client_secret" {
  type      = string
  sensitive = true
}

locals {
  ssm_prefix = "/${var.name}"
}

data "aws_caller_identity" "current" {}

# ---------- Secrets (SSM, in the data region)

resource "random_password" "session" {
  length  = 64
  special = false
}

resource "aws_ssm_parameter" "client_secret" {
  name  = "${local.ssm_prefix}/cognito-client-secret"
  type  = "SecureString"
  value = var.client_secret
}

resource "aws_ssm_parameter" "session_secret" {
  name  = "${local.ssm_prefix}/session-secret"
  type  = "SecureString"
  value = random_password.session.result
}

# ---------- Compute role (what the Next.js server runs as)

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "compute" {
  name               = "${var.name}-app-compute"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

data "aws_iam_policy_document" "compute" {
  statement {
    sid = "Table"
    actions = [
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
      "dynamodb:Query", "dynamodb:Scan", "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem",
      "dynamodb:TransactGetItems", "dynamodb:TransactWriteItems", "dynamodb:ConditionCheckItem",
    ]
    resources = [var.table_arn, "${var.table_arn}/index/*"]
  }

  statement {
    sid = "Files"
    actions = [
      "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
      "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts",
    ]
    resources = ["${var.bucket_arn}/*"]
  }

  statement {
    sid       = "FilesBucket"
    actions   = ["s3:ListBucket", "s3:ListBucketMultipartUploads"]
    resources = [var.bucket_arn]
  }

  statement {
    sid = "Cognito"
    actions = [
      "cognito-idp:InitiateAuth", "cognito-idp:GlobalSignOut", "cognito-idp:RevokeToken",
      "cognito-idp:ForgotPassword", "cognito-idp:ConfirmForgotPassword", "cognito-idp:ChangePassword",
      "cognito-idp:AdminCreateUser", "cognito-idp:AdminSetUserPassword", "cognito-idp:AdminGetUser",
      "cognito-idp:AdminDisableUser", "cognito-idp:AdminEnableUser", "cognito-idp:AdminUserGlobalSignOut",
      "cognito-idp:AdminDeleteUser",
    ]
    resources = [var.user_pool_arn]
  }

  statement {
    sid       = "Email"
    actions   = ["ses:SendEmail"]
    resources = [var.ses_identity_arn]
  }

  statement {
    sid       = "ZipJobs"
    actions   = ["lambda:InvokeFunction"]
    resources = [var.zip_function_arn]
  }

  statement {
    sid       = "Secrets"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["arn:aws:ssm:${var.data_region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "compute" {
  name   = "app-access"
  role   = aws_iam_role.compute.id
  policy = data.aws_iam_policy_document.compute.json
}

# ---------- Amplify app

resource "aws_amplify_app" "this" {
  region           = var.app_region
  name             = var.name
  repository       = var.repository
  access_token     = var.access_token
  platform         = "WEB_COMPUTE"
  compute_role_arn = aws_iam_role.compute.arn

  # Build steps live in amplify.yml at the repo root.

  lifecycle {
    # The token is only needed to connect the repo on first create.
    ignore_changes = [access_token]
  }
}

resource "aws_amplify_branch" "main" {
  region            = var.app_region
  app_id            = aws_amplify_app.this.id
  branch_name       = var.production_branch
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true

  environment_variables = {
    DATA_REGION          = var.data_region
    TABLE_NAME           = var.table_name
    FILES_BUCKET         = var.bucket_name
    COGNITO_USER_POOL_ID = var.user_pool_id
    COGNITO_CLIENT_ID    = var.user_pool_client_id
    SES_FROM_EMAIL       = var.from_email
    SSM_PREFIX           = local.ssm_prefix
    APP_URL              = "https://${var.domain_name}"
    ZIP_FUNCTION         = var.zip_function_name
  }
}

resource "aws_amplify_domain_association" "this" {
  region                = var.app_region
  app_id                = aws_amplify_app.this.id
  domain_name           = var.domain_name
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}

# DNS records for the custom domain. Amplify only creates these itself if the
# zone already exists when the domain is added, so Terraform manages them.
locals {
  # "<name> CNAME <value>"
  cert_record = split(" ", trimspace(aws_amplify_domain_association.this.certificate_verification_dns_record))
  # " CNAME <distribution>.cloudfront.net"
  cdn_domain = element(split(" ", trimspace(one(aws_amplify_domain_association.this.sub_domain[*].dns_record))), 1)
}

resource "aws_route53_record" "certificate" {
  zone_id = var.zone_id
  name    = local.cert_record[0]
  type    = "CNAME"
  ttl     = 300
  records = [local.cert_record[2]]
}

# The app lives at the zone apex, which can't be a CNAME, so use an alias.
resource "aws_route53_record" "app" {
  zone_id = var.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = local.cdn_domain
    zone_id                = "Z2FDTNDATAQYW2" # fixed hosted zone ID for all CloudFront distributions
    evaluate_target_health = false
  }
}

output "default_domain" {
  value = "${aws_amplify_branch.main.branch_name}.${aws_amplify_app.this.default_domain}"
}

output "ssm_prefix" {
  value = local.ssm_prefix
}
