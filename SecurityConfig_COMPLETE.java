package org.example.recommendationservice.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired(required = false)
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Désactiver CSRF pour API REST
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Activer CORS
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS) // API stateless avec JWT
                )
                .authorizeHttpRequests(auth -> auth
                        // Autoriser les requêtes OPTIONS pour CORS preflight
                        .requestMatchers("OPTIONS").permitAll()
                        // Autoriser l'accès à l'endpoint de recommandations avec authentification
                        .requestMatchers("/api/recommendations/**").authenticated()
                        // Autoriser l'accès aux endpoints publics
                        .requestMatchers("/actuator/**", "/health", "/error").permitAll()
                        // Toutes les autres requêtes nécessitent une authentification
                        .anyRequest().authenticated()
                );

        // Ajouter le filtre JWT seulement s'il existe
        if (jwtAuthenticationFilter != null) {
            http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        }

        http.exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Token manquant ou invalide\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Accès refusé\"}");
                        })
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Autoriser les origines Angular
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:4200",  // Angular dev server
                "http://localhost:4000",  // Angular production server
                "http://localhost:3000"   // Alternative
        ));

        // Autoriser les méthodes HTTP nécessaires
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Autoriser les headers nécessaires pour JWT et autres
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Requested-With",
                "Accept",
                "Origin",
                "Access-Control-Request-Method",
                "Access-Control-Request-Headers"
        ));

        // Autoriser l'envoi de credentials (cookies, auth headers)
        configuration.setAllowCredentials(true);

        // Définir les headers exposés au client
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"
        ));

        // Durée de mise en cache des preflight requests
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}

