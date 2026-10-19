# Cognito user pool: public self sign-up with an emailed code, plus admin-created
# accounts for invites — see docs/architecture.md §3 and §16.

variable "name" {
  type = string
}

# Cognito's own emails (sign-up codes, password resets) go through our SES
# domain instead of Cognito's default sender (50/day, from verificationemail.com).
variable "ses_identity_arn" {
  type = string
}

variable "from_email" {
  type = string
}

variable "configuration_set" {
  type = string
}

# Lets Cognito send through SES on the account's behalf.
resource "aws_iam_service_linked_role" "cognito_email" {
  aws_service_name = "email.cognito-idp.amazonaws.com"
}

resource "aws_cognito_user_pool" "this" {
  name                     = var.name
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = "ACTIVE"
  depends_on               = [aws_iam_service_linked_role.cognito_email]

  email_configuration {
    email_sending_account = "DEVELOPER"
    source_arn            = var.ses_identity_arn
    from_email_address    = "MacTidar Cloud <${var.from_email}>"
    configuration_set     = var.configuration_set
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your MacTidar Cloud verification code"
    email_message        = "Welcome to MacTidar Cloud! Your verification code is {####}. It expires in 24 hours. If you didn't sign up, you can ignore this email."
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 3
      max_length = 254
    }
  }
}

# Used only by the Next.js server, never the browser.
resource "aws_cognito_user_pool_client" "server" {
  name                          = "${var.name}-server"
  user_pool_id                  = aws_cognito_user_pool.this.id
  generate_secret               = true
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true
  explicit_auth_flows           = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

output "user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  value = aws_cognito_user_pool.this.arn
}

output "client_id" {
  value = aws_cognito_user_pool_client.server.id
}

output "client_secret" {
  value     = aws_cognito_user_pool_client.server.client_secret
  sensitive = true
}
