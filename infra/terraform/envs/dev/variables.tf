variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "root_domain" {
  type    = string
  default = "dev.test"   # dùng domain giả cho test
}

variable "api_host" {
  type    = string
  default = "api"
}

variable "ws_host" {
  type    = string
  default = "ws"
}