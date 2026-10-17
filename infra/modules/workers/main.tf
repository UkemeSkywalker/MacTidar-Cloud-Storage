# Scheduled cleanup jobs — see docs/architecture.md §10.

variable "name" { type = string }
variable "table_name" { type = string }
variable "table_arn" { type = string }
variable "bucket_name" { type = string }
variable "bucket_arn" { type = string }
variable "ses_events_topic_arn" { type = string }
# Where the Lambdas, schedules and alarms run (next to the data).
variable "region" { type = string }
# The SES events topic lives with SES; its subscription must be created there.
variable "topic_region" { type = string }

data "archive_file" "code" {
  type        = "zip"
  source_dir  = "${path.module}/src"
  output_path = "${path.module}/.build/workers.zip"
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.name}-workers"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda" {
  statement {
    actions = [
      "dynamodb:Query", "dynamodb:Scan", "dynamodb:DeleteItem", "dynamodb:UpdateItem",
      "dynamodb:BatchWriteItem", "dynamodb:ConditionCheckItem",
    ]
    resources = [var.table_arn, "${var.table_arn}/index/*"]
  }
  statement {
    actions   = ["s3:DeleteObject", "s3:AbortMultipartUpload"]
    resources = ["${var.bucket_arn}/*"]
  }
  statement {
    sid       = "ZipRead"
    actions   = ["s3:GetObject"]
    resources = ["${var.bucket_arn}/files/*"]
  }
  statement {
    sid       = "ZipWrite"
    actions   = ["s3:PutObject"]
    resources = ["${var.bucket_arn}/tmp/zips/*"]
  }
  statement {
    sid       = "ZipJobs"
    actions   = ["dynamodb:GetItem"]
    resources = [var.table_arn]
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "cleanup-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda.json
}

locals {
  jobs = {
    purge-trash = {
      description = "Permanently deletes items that have been in the trash for 30 days"
      schedule    = "cron(0 2 * * ? *)" # daily 02:00 Africa/Johannesburg
      timeout     = 300
    }
    cleanup-uploads = {
      description = "Cancels uploads left unfinished for 24 hours and releases their reserved space"
      schedule    = "rate(1 hour)"
      timeout     = 120
    }
  }
}

resource "aws_cloudwatch_log_group" "job" {
  region            = var.region
  for_each          = local.jobs
  name              = "/aws/lambda/${var.name}-${each.key}"
  retention_in_days = 30
}

resource "aws_lambda_function" "job" {
  region           = var.region
  for_each         = local.jobs
  function_name    = "${var.name}-${each.key}"
  description      = each.value.description
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "${each.key}.handler"
  filename         = data.archive_file.code.output_path
  source_code_hash = data.archive_file.code.output_base64sha256
  timeout          = each.value.timeout
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME   = var.table_name
      FILES_BUCKET = var.bucket_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.job, aws_iam_role_policy_attachment.logs]
}

data "aws_iam_policy_document" "scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${var.name}-workers-scheduler"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume.json
}

resource "aws_iam_role_policy" "scheduler" {
  name = "invoke-workers"
  role = aws_iam_role.scheduler.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "lambda:InvokeFunction", Resource = [for f in aws_lambda_function.job : f.arn] }]
  })
}

resource "aws_scheduler_schedule" "job" {
  region                       = var.region
  for_each                     = local.jobs
  name                         = "${var.name}-${each.key}"
  schedule_expression          = each.value.schedule
  schedule_expression_timezone = "Africa/Johannesburg"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.job[each.key].arn
    role_arn = aws_iam_role.scheduler.arn
  }
}

resource "aws_cloudwatch_metric_alarm" "errors" {
  region              = var.region
  for_each            = local.jobs
  alarm_name          = "${var.name}-${each.key}-errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.job[each.key].function_name }
  statistic           = "Sum"
  period              = 3600
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
}

# SES bounces: cancel pending invites to addresses that hard-bounce.
resource "aws_cloudwatch_log_group" "ses_events" {
  region            = var.region
  name              = "/aws/lambda/${var.name}-ses-events"
  retention_in_days = 30
}

resource "aws_lambda_function" "ses_events" {
  region           = var.region
  function_name    = "${var.name}-ses-events"
  description      = "Cancels invites to email addresses that bounce"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "ses-events.handler"
  filename         = data.archive_file.code.output_path
  source_code_hash = data.archive_file.code.output_base64sha256
  timeout          = 60
  memory_size      = 256

  environment {
    variables = {
      TABLE_NAME   = var.table_name
      FILES_BUCKET = var.bucket_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.ses_events, aws_iam_role_policy_attachment.logs]
}

resource "aws_lambda_permission" "ses_events" {
  region        = var.region
  statement_id  = "AllowSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ses_events.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = var.ses_events_topic_arn
}

resource "aws_sns_topic_subscription" "ses_events" {
  region    = var.topic_region
  topic_arn = var.ses_events_topic_arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.ses_events.arn
}

# Folder downloads: invoked asynchronously by the app, streams S3 → zip → S3.
resource "aws_cloudwatch_log_group" "zip" {
  region            = var.region
  name              = "/aws/lambda/${var.name}-zip-folder"
  retention_in_days = 30
}

resource "aws_lambda_function" "zip" {
  region           = var.region
  function_name    = "${var.name}-zip-folder"
  description      = "Builds a .zip of a folder for download"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "zip-folder.handler"
  filename         = data.archive_file.code.output_path
  source_code_hash = data.archive_file.code.output_base64sha256
  timeout          = 900
  memory_size      = 1024

  environment {
    variables = {
      TABLE_NAME   = var.table_name
      FILES_BUCKET = var.bucket_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.zip, aws_iam_role_policy_attachment.logs]
}

# Async invocations: don't retry a failed zip (the app shows the error instead).
resource "aws_lambda_function_event_invoke_config" "zip" {
  region                 = var.region
  function_name          = aws_lambda_function.zip.function_name
  maximum_retry_attempts = 0
}

output "function_names" {
  value = concat([for f in aws_lambda_function.job : f.function_name], [aws_lambda_function.zip.function_name])
}

output "zip_function_arn" {
  value = aws_lambda_function.zip.arn
}

output "zip_function_name" {
  value = aws_lambda_function.zip.function_name
}
