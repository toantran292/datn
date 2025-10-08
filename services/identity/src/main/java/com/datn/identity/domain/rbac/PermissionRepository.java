package com.datn.identity.domain.rbac;

import java.util.List;

public interface PermissionRepository {
    List<Permission> listAll();
}