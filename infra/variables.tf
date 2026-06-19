variable "tenancy_ocid"     { type = string }
variable "user_ocid"        { type = string }
variable "fingerprint"      { type = string }
variable "private_key_path" { type = string }
variable "region"           { type = string }

variable "compartment_ocid" {
  type        = string
  description = "Compartimento onde criar os recursos. Use o tenancy_ocid para o compartimento raiz."
}

variable "ssh_public_key_path" {
  type    = string
  default = "~/.ssh/id_ed25519.pub"
}

variable "instance_name" {
  type    = string
  default = "atlas"
}
