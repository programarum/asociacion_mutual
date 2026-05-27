# asociacion_mutual

Instrucciones rápidas para la API REST con Sanctum y SQLite

1. Copia `.env.example` a `.env` y ajusta si hace falta.
2. Instala dependencias y Sanctum:

```bash
composer install
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

3. Crear la base de datos SQLite y migrar:

```bash
mkdir -p database
touch database/database.sqlite
php artisan migrate
```

4. Ejecutar la semilla del administrador:

```bash
php artisan db:seed --class=\Database\Seeders\AdminUserSeeder
```

5. Probar endpoints (ejemplo usando `curl`):

Login:

```bash
curl -X POST http://localhost/api/login -d "email=admin@example.com&password=password"
```

Registro ejemplo (si se desea):

```bash
curl -X POST http://localhost/api/register -d "name=Demo&email=demo@example.com&password=secret&password_confirmation=secret"
```
