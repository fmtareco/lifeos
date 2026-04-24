package com.lifeos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * CORS is intentionally not configured here.
     * The app is served by Spring Boot itself, so the frontend and API
     * share the same origin — no CORS needed.
     *
     * If you ever separate frontend and backend, add CORS back here
     * and restrict to your frontend domain.
     */

    /**
     * SPA fallback: any non-asset, non-API path serves index.html
     * so client-side navigation works on direct URL access.
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
