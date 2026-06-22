terraform {
  required_version = ">= 1.5.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Pega o primeiro Availability Domain da região
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# Acha a imagem Ubuntu 24.04 x86 mais recente compatível com a shape (sem hardcode de OCID)
data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = "VM.Standard.E2.1.Micro"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# ---------- Rede ----------
resource "oci_core_vcn" "vcn" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "${var.instance_name}-vcn"
  dns_label      = "atlas"
}

resource "oci_core_internet_gateway" "igw" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.instance_name}-igw"
}

resource "oci_core_route_table" "rt" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.instance_name}-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

# Firewall na nuvem (Security List): 22, 80, 443
resource "oci_core_security_list" "sl" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.instance_name}-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_subnet" "subnet" {
  compartment_id    = var.compartment_ocid
  vcn_id            = oci_core_vcn.vcn.id
  cidr_block        = "10.0.1.0/24"
  display_name      = "${var.instance_name}-subnet"
  route_table_id    = oci_core_route_table.rt.id
  security_list_ids = [oci_core_security_list.sl.id]
  dns_label         = "public"
}

# ---------- VM ----------
resource "oci_core_instance" "vm" {
  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = var.instance_name
  # Always Free x86 (1 OCPU / 1 GB) — shape fixa, sem shape_config.
  # Quase sempre tem capacidade, diferente do A1 ARM em São Paulo.
  shape = "VM.Standard.E2.1.Micro"

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu.images[0].id
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.subnet.id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data           = base64encode(file("${path.module}/cloud-init.sh"))
  }
}
