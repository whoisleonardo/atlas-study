output "public_ip" {
  value = oci_core_instance.vm.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@${oci_core_instance.vm.public_ip}"
}
