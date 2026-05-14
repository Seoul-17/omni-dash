package com.omnidash;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class OmnidashApplication {
    public static void main(String[] args) {
        SpringApplication.run(OmnidashApplication.class, args);
    }
}
