<?php

return [
    'name' => 'SPUP Inventory',
    'manifest' => [
        'name' => env('APP_NAME', 'SPUP Inventory'),
        'short_name' => 'SPUP Inventory',
        'start_url' => '/',
        'background_color' => '#ffffff',
        'theme_color' => '#000000',
        'display' => 'standalone',
        'orientation'=> 'any',
        'status_bar'=> 'black',
        'icons' => [
            '72x72' => [
                'path' => '/images/icons/android-launchericon-72-72.png',
                'purpose' => 'any'
            ],
            '96x96' => [
                'path' => '/images/icons/android-launchericon-96-96.png',
                'purpose' => 'any'
            ],
            '128x128' => [
                'path' => '/images/icons/android-launchericon-128-128.png',
                'purpose' => 'any'
            ],
            '144x144' => [
                'path' => '/images/icons/android-launchericon-144-144.png',
                'purpose' => 'any'
            ],
            '152x152' => [
                'path' => '/images/icons/android-launchericon-152-152.png',
                'purpose' => 'any'
            ],
            '192x192' => [
                'path' => '/images/icons/android-launchericon-192-192.png',
                'purpose' => 'any'
            ],
            '384x384' => [
                'path' => '/images/icons/android-launchericon-384-384.png',
                'purpose' => 'any'
            ],
            '512x512' => [
                'path' => '/images/icons/android-launchericon-512-512.png',
                'purpose' => 'any'
            ],
        ],
        'splash' => [
            '640x1136' => '/images/icons/SplashScreen.scale-100.png',
            '750x1334' => '/images/icons/SplashScreen.scale-125.png',
            '828x1792' => '/images/icons/SplashScreen.scale-150.png',
            '1125x2436' => '/images/icons/SplashScreen.scale-200.png',
            '1242x2208' => '/images/icons/SplashScreen.scale-400.png',
        ],
        'shortcuts' => [
            [
                'name' => 'Shortcut Link 1',
                'description' => 'Shortcut Link 1 Description',
                'url' => '/shortcutlink1',
                'icons' => [
                    "src" => "/images/icons/icon-72x72.png",
                    "purpose" => "any"
                ]
            ],
            [
                'name' => 'Shortcut Link 2',
                'description' => 'Shortcut Link 2 Description',
                'url' => '/shortcutlink2'
            ]
        ],
        'custom' => []
    ]
];
