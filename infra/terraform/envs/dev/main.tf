# Ví dụ tạo ECR trước cho CI
module "ecr" {
  source = "../../modules/ecr"
  repositories = ["gateway","identity","notify","file","search","billing"]
}

# (Tuỳ bạn) tạo VPC/ECS sau khi sẵn sàng
# module "vpc"  { source = "../../modules/vpc"  }
# module "ecs"  { source = "../../modules/ecs"  }

# Route53/ACM chỉ dùng khi đã có domain thật:
# module "route53" {
#   source      = "../../modules/route53"
#   root_domain = var.root_domain
#   api_host    = var.api_host
#   ws_host     = var.ws_host
# }
# module "acm" {
#   source      = "../../modules/acm"
#   root_domain = var.root_domain
# }