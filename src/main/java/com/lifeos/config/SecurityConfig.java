package com.lifeos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Username and password come from environment variables:
     *   APP_USER  (default: admin)
     *   APP_PASS  (default: changeme  — override this in production!)
     *
     * Railway: set these in your service's Variables tab.
     * Local dev: set in application.yml or export them in your shell.
     */
    @Value("${app.security.username:admin}")
    private String username;

    @Value("${app.security.password:changeme}")
    private String password;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Require authentication for every URL
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/login.html", "/error").permitAll()
                .anyRequest().authenticated()
            )
            // Browser form login — redirects to /login when unauthenticated
            .formLogin(form -> form
                .loginPage("/login.html")
                .loginProcessingUrl("/login")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login.html?error=true")
                .permitAll()
            )
            // Also support HTTP Basic for API clients / curl
            .httpBasic(withDefaults())
            // Logout
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login.html")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            // CSRF: disabled — single-user personal app, all requests go through
            // our own frontend served by the same origin
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user = User.builder()
                .username(username)
                .password(passwordEncoder().encode(password))
                .roles("USER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
