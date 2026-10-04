FROM php:8.3-fpm-alpine

# Set working directory
WORKDIR /var/www/backend

# Install system dependencies & libraries
RUN apk add --no-cache \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    icu-dev

# Configure and install PHP extensions needed for Laravel & Japanese text handling
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        gd \
        zip \
        bcmath \
        opcache \
        intl

# Install Composer binary from official image
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . .

# Ensure storage & cache permissions
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache \
    && chmod -R 775 /var/www/backend/storage /var/www/backend/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
