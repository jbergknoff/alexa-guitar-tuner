terraform {
  backend "s3" {
    region = "us-east-1"
    bucket = "jbergknoff-deploy"
    key = "alexa-guitar-tuner/terraform.tfstate"
  }
}

provider "aws" {
  version = "1.5"
  region = "us-east-1"
  access_key = "${var.aws_access_key}"
  secret_key = "${var.aws_secret}"
}

resource "aws_iam_role_policy" "iam_policy_for_lambda" {
  name = "log_access"
  role = "${aws_iam_role.lambda_role.id}"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF
}

resource "aws_iam_role" "lambda_role" {
    name = "lambda_execution"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_function" "alexa_guitar_tuner" {
  function_name = "alexa-guitar-tuner"
  role = "${aws_iam_role.lambda_role.arn}"
  handler = "index.handler"
  runtime = "nodejs14.x"
  filename = "${var.zip_filename}"
  source_code_hash = "${base64sha256(file(var.zip_filename))}"
}
