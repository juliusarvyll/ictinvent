<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'ICT Inventory') }}</title>
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
    </head>
    <body class="font-sans antialiased">
        <div id="app"></div>
    </body>
</html>
