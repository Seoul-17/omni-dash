package com.omnidash.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "omnidash")
public class OmnidashProperties {

    private Session session = new Session();
    private Cors cors = new Cors();
    private Skills skills = new Skills();

    @Getter @Setter
    public static class Session {
        private long ttlSeconds = 86400L;
        private String cookieName = "omnidash_sid";
    }

    @Getter @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000");
    }

    @Getter @Setter
    public static class Skills {
        /** 외부 디렉토리 경로. 비워두면 classpath 내장 YAML 사용. */
        private String configPath = "";
        private String version = "3.0.0";
    }
}
