package com.datn.identity.infrastructure.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

public final class Jsons {
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    private Jsons(){}

    public static String toJson(Object o){
        try { return MAPPER.writeValueAsString(o); }
        catch (Exception e){ throw new RuntimeException(e); }
    }
}