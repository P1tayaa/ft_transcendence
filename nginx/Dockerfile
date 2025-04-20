FROM nginx:alpine

# Copy custom configuration
COPY nginx.dev.conf /etc/nginx/conf.d/default.conf

# Create uploads directory
RUN mkdir -p /var/www/uploads

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]