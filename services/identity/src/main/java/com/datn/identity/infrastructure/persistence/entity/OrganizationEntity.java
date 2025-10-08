package com.datn.identity.infrastructure.persistence.entity;

import com.datn.identity.common.Slug;
import com.datn.identity.infrastructure.persistence.converter.SlugConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity @Table(name="organizations")
public class OrganizationEntity {
    @Id @Column(columnDefinition="uuid") private UUID id;
    @Convert(converter=SlugConverter.class) 
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name="slug", columnDefinition="citext", nullable=false, unique=true)
    private Slug slug;
    @Column(name="display_name", nullable=false) private String displayName;

    public UUID getId(){return id;} public void setId(UUID id){this.id=id;}
    public Slug getSlug(){return slug;} public void setSlug(Slug s){this.slug=s;}
    public String getDisplayName(){return displayName;} public void setDisplayName(String n){this.displayName=n;}
}