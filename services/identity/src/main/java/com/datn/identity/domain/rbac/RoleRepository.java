package com.datn.identity.domain.rbac;

import java.util.List;
import java.util.Optional;

public interface RoleRepository {
    Optional<Role> findByName(String nameCI);
    Optional<Role> findById(Integer id);
    List<Role> listAll();
}