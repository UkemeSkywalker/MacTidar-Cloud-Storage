# Single-table design — see docs/architecture.md §5.

variable "name" {
  type = string
}

variable "quota_bytes" {
  type = number
}

variable "max_file_bytes" {
  type = number
}

resource "aws_dynamodb_table" "this" {
  name                        = var.name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "PK"
  range_key                   = "SK"
  deletion_protection_enabled = true

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  dynamic "attribute" {
    for_each = ["GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK", "GSI3PK", "GSI3SK"]
    content {
      name = attribute.value
      type = "S"
    }
  }

  dynamic "global_secondary_index" {
    for_each = ["GSI1", "GSI2", "GSI3"]
    content {
      name            = global_secondary_index.value
      projection_type = "ALL"

      key_schema {
        attribute_name = "${global_secondary_index.value}PK"
        key_type       = "HASH"
      }
      key_schema {
        attribute_name = "${global_secondary_index.value}SK"
        key_type       = "RANGE"
      }
    }
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# Initial team settings. The app updates these counters at runtime, so
# Terraform only creates the item and never overwrites it.
resource "aws_dynamodb_table_item" "team_settings" {
  table_name = aws_dynamodb_table.this.name
  hash_key   = aws_dynamodb_table.this.hash_key
  range_key  = aws_dynamodb_table.this.range_key

  item = jsonencode({
    PK           = { S = "TEAM" }
    SK           = { S = "SETTINGS" }
    quotaBytes   = { N = tostring(var.quota_bytes) }
    usedBytes    = { N = "0" }
    freeBytes    = { N = tostring(var.quota_bytes) }
    maxFileBytes = { N = tostring(var.max_file_bytes) }
    alertPercent = { N = "80" }
  })

  lifecycle {
    ignore_changes = [item]
  }
}

output "table_name" {
  value = aws_dynamodb_table.this.name
}

output "table_arn" {
  value = aws_dynamodb_table.this.arn
}
