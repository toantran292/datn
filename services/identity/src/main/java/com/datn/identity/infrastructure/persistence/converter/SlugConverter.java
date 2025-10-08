package com.datn.identity.infrastructure.persistence.converter;

import com.datn.identity.common.Slug;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class SlugConverter implements AttributeConverter<Slug, String> {
    @Override public String convertToDatabaseColumn(Slug attribute){ return attribute == null ? null : attribute.value(); }
    @Override public Slug convertToEntityAttribute(String dbData){ return dbData == null ? null : Slug.of(dbData); }
}