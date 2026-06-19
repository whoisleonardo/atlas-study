package com.estudos.api.util;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class Parse {
    private Parse() {}

    public static <E extends Enum<E>> E enumOr(Class<E> type, String v, E def) {
        if (v == null || v.isBlank()) return def;
        try {
            return Enum.valueOf(type, v.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return def;
        }
    }

    public static LocalDate date(String v) {
        if (v == null || v.isBlank()) return null;
        try {
            return LocalDate.parse(v.trim());
        } catch (Exception e) {
            return null;
        }
    }

    public static Integer intOr(String v, int def) {
        if (v == null || v.isBlank()) return def;
        try {
            return Integer.parseInt(v.trim());
        } catch (Exception e) {
            return def;
        }
    }

    public static BigDecimal big(String v) {
        if (v == null || v.isBlank()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(v.trim().replace(",", "."));
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
