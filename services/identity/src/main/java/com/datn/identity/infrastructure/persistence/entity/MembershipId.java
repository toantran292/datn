package com.datn.identity.infrastructure.persistence.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class MembershipId implements Serializable {
    public UUID userId;
    public UUID orgId;
    public MembershipId() {}
    public MembershipId(UUID userId, UUID orgId){ this.userId=userId; this.orgId=orgId; }
    @Override public boolean equals(Object o){ if (this==o) return true; if (!(o instanceof MembershipId m)) return false; return Objects.equals(userId,m.userId)&&Objects.equals(orgId,m.orgId);}
    @Override public int hashCode(){ return Objects.hash(userId, orgId); }
}