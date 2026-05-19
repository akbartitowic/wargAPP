<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Warga App - Profile</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "background": "#fcf9f8",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#2a4386",
                        "on-secondary-fixed-variant": "#474836",
                        "tertiary": "#001902",
                        "on-secondary-fixed": "#1b1d0e",
                        "primary-container": "#002366",
                        "primary": "#00113a",
                        "tertiary-fixed-dim": "#78dc77",
                        "surface-variant": "#e4e2e1",
                        "secondary-fixed": "#e4e4cc",
                        "inverse-surface": "#303030",
                        "surface-container-lowest": "#ffffff",
                        "inverse-primary": "#b3c5ff",
                        "on-surface-variant": "#444650",
                        "on-tertiary": "#ffffff",
                        "tertiary-fixed": "#94f990",
                        "tertiary-container": "#003007",
                        "on-error-container": "#93000a",
                        "primary-fixed-dim": "#b3c5ff",
                        "outline": "#757682",
                        "surface-tint": "#435b9f",
                        "on-tertiary-fixed-variant": "#005313",
                        "on-surface": "#1b1c1c",
                        "surface-bright": "#fcf9f8",
                        "secondary-container": "#e1e1c9",
                        "surface-container": "#f0eded",
                        "surface-container-high": "#eae7e7",
                        "secondary-fixed-dim": "#c8c8b0",
                        "on-primary-fixed": "#00174a",
                        "on-tertiary-fixed": "#002204",
                        "primary-fixed": "#dbe1ff",
                        "error-container": "#ffdad6",
                        "on-primary-container": "#758dd5",
                        "surface-dim": "#dcd9d9",
                        "on-primary": "#ffffff",
                        "surface-container-highest": "#e4e2e1",
                        "surface-container-low": "#f6f3f2",
                        "on-background": "#1b1c1c",
                        "on-secondary-container": "#636451",
                        "secondary": "#5e604d",
                        "surface": "#fcf9f8",
                        "error": "#ba1a1a",
                        "on-secondary": "#ffffff",
                        "outline-variant": "#c5c6d2",
                        "on-tertiary-container": "#3fa345",
                        "inverse-on-surface": "#f3f0f0"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "xs": "0.25rem",
                        "gutter": "1rem",
                        "lg": "1.5rem",
                        "base": "8px",
                        "sm": "0.5rem",
                        "xl": "2rem",
                        "container-margin": "1.5rem",
                        "md": "1rem"
                    },
                    "fontFamily": {
                        "body-md": ["Inter"],
                        "headline-sm": ["Plus Jakarta Sans"],
                        "body-sm": ["Inter"],
                        "label-sm": ["Inter"],
                        "headline-lg-mobile": ["Plus Jakarta Sans"],
                        "label-md": ["Inter"],
                        "headline-md": ["Plus Jakarta Sans"],
                        "body-lg": ["Inter"],
                        "headline-lg": ["Plus Jakarta Sans"]
                    },
                    "fontSize": {
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
                        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen flex flex-col font-body-md">
<!-- TopAppBar (Web & Mobile) -->
<header class="bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container font-headline-sm text-headline-sm flex justify-between items-center px-container-margin py-md w-full z-50">
<div class="flex items-center gap-sm">
<img alt="Resident Profile Photo" class="w-10 h-10 rounded-full object-cover border-2 border-primary-container" data-alt="A close up portrait of a middle aged Indonesian man with a friendly, warm smile. He has short black hair and is wearing a neat, light blue polo shirt. The lighting is soft and natural, suggesting an outdoor residential setting in the morning. The overall mood is welcoming, trustworthy, and neighborly, aligning with a secure community app aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmLP-Vfslfx_2ft16nH0CAGl9aaiDQUq5pZG51JLqADSy_wIk_4W-xKKeD3qCaZR7kZoRzHwYAaJ5Nbwi8NU1Q_dLfGXFUha-YZIAj406Er1i20F2L1xZMRAmG29Prcg0_nFAU2hu2PDKYaWVMgzl41-B2Q3XeGbaEegd2Ofdrfcue4F-1NXeKLRCM093y98Lodo3pTHc29NnYS9S5C2rMoNCAxe5YZBLtHXo8tE8jHfKyWPydu7AO-r5NX4HI3fzpCkiPTPfGz2aQ"/>
<span class="font-headline-md text-headline-md font-bold text-on-primary">Warga App</span>
</div>
<button aria-label="Notifications" class="text-on-primary hover:opacity-80 active:scale-95 transition-transform">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</header>
<!-- Main Content Canvas -->
<main class="flex-grow flex flex-col pb-24 max-w-[1200px] mx-auto w-full md:grid md:grid-cols-12 md:gap-gutter md:px-container-margin md:py-lg">
<!-- Navigation Drawer (Web Only) -->
<aside class="hidden md:flex flex-col h-full p-gutter bg-surface dark:bg-surface-container text-primary dark:text-primary-fixed-dim font-body-md h-full w-80 rounded-r-xl shadow-xl col-span-3">
<div class="flex flex-col items-start mb-lg border-b border-outline-variant pb-md">
<img alt="Resident Avatar" class="w-16 h-16 rounded-full object-cover mb-sm" data-alt="A close up portrait of a middle aged Indonesian man with a friendly, warm smile. He has short black hair and is wearing a neat, light blue polo shirt. The lighting is soft and natural, suggesting an outdoor residential setting in the morning. The overall mood is welcoming, trustworthy, and neighborly, aligning with a secure community app aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfp1WnPOQdc67eCdc8NHQyDIpRIeMxJJtGrbI5jNql4AfttR1nlVOV_H0QIFvW6MM4y9X1dGsYLbaKSYfTY3Bt4hLfrAjCFwKJGVsOleXZUdxEiHV69jzlLtKygbhuL0id1dhlaGx3CdzGsNMnnaD97kL5MXqTtGczW4lq7J5vAlx1zwqnl4OZbyEAepeODIPu6KiAV6_jihkUQopdP0GPhOT2oPsKWmQK99aAR2bwyaDdBiEemtCczCTCpNasukn_HBwLcgvAm1lp"/>
<span class="font-headline-sm text-headline-sm text-on-surface">Resident Name</span>
<span class="text-body-sm font-body-sm text-on-surface-variant">Block A-12</span>
<span class="text-label-sm font-label-sm bg-primary-container text-on-primary-container px-2 py-1 rounded-full mt-xs">Parent Account</span>
</div>
<nav class="flex flex-col divide-y divide-outline-variant">
<a class="flex items-center gap-md py-sm px-sm text-on-surface hover:bg-surface-variant hover:bg-surface-container-high transition-all rounded-lg group" href="#">
<span class="material-symbols-outlined group-active:scale-95 transition-transform" data-icon="emergency">emergency</span>
<span>Emergency Call</span>
</a>
<a class="flex items-center gap-md py-sm px-sm text-on-surface hover:bg-surface-variant hover:bg-surface-container-high transition-all rounded-lg group" href="#">
<span class="material-symbols-outlined group-active:scale-95 transition-transform" data-icon="security">security</span>
<span>Security Report</span>
</a>
<a class="flex items-center gap-md py-sm px-sm text-on-surface hover:bg-surface-variant hover:bg-surface-container-high transition-all rounded-lg group" href="#">
<span class="material-symbols-outlined group-active:scale-95 transition-transform" data-icon="group_add">group_add</span>
<span>Guest Log</span>
</a>
<a class="flex items-center gap-md py-sm px-sm text-on-surface hover:bg-surface-variant hover:bg-surface-container-high transition-all rounded-lg group" href="#">
<span class="material-symbols-outlined group-active:scale-95 transition-transform" data-icon="apartment">apartment</span>
<span>Facility Booking</span>
</a>
<a class="flex items-center gap-md py-sm px-sm text-on-surface hover:bg-surface-variant hover:bg-surface-container-high transition-all rounded-lg group" href="#">
<span class="material-symbols-outlined group-active:scale-95 transition-transform" data-icon="description">description</span>
<span>Document Request</span>
</a>
<a class="flex items-center gap-md py-sm px-sm text-on-surface hover:bg-surface-variant hover:bg-surface-container-high transition-all rounded-lg group" href="#">
<span class="material-symbols-outlined group-active:scale-95 transition-transform" data-icon="help">help</span>
<span>Help Center</span>
</a>
</nav>
</aside>
<!-- Profile Canvas -->
<section class="flex flex-col w-full md:col-span-9 md:gap-lg">
<!-- Mobile Header Area (Bento Top) -->
<div class="bg-primary text-on-primary px-container-margin pt-xl pb-12 rounded-b-[2rem] md:rounded-xl md:p-container-margin flex flex-col items-center relative overflow-hidden">
<!-- Decorative subtle gradient -->
<div class="absolute inset-0 bg-gradient-to-tr from-primary-container/20 to-transparent opacity-50"></div>
<div class="relative z-10 flex flex-col items-center text-center">
<div class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-surface-container-lowest bg-surface-container-high flex items-center justify-center overflow-hidden mb-sm shadow-lg">
<img alt="Bpk. Heru Pratama Profile Picture" class="w-full h-full object-cover" data-alt="A high quality, professional yet warm portrait of an Indonesian man in his late 40s. He has a welcoming smile, short dark hair, and is wearing a crisp collared shirt. The background is a soft, out-of-focus garden setting, implying a peaceful residential environment. The lighting is bright and inviting, fitting a community application." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQyHgZrnluFh-bG79XcXSM2rxWfLunMhw_TMy9-yG8uPYWzxSBnBx7bkQ-SyChtc2d7SViYw09fESabrYt0PR6OVFf9PT7aAnoJTkj40Sar2unMGYNurgHQT9CvFvPJcYtM9aqJjbwzDnQjFX-Zl9tXLQEfEjJ7i_VUAMiCiXZ3Xe3EbFC52hL6D-e3iNXTVMI6501S3lhUVif8Ay8lZP9JpKQK4roYd-ep2qACZSt_3sy4WhHxRBM9vAyv56jpEY2wOU-Vc_t3dZp"/>
</div>
<h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-xs">Bpk. Heru Pratama</h1>
<span class="bg-primary-container text-on-primary-container font-label-md text-label-md px-3 py-1 rounded-full inline-flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]" data-icon="verified_user">verified_user</span>
                        Kepala Keluarga / Parent Account
                    </span>
</div>
</div>
<!-- Profile Data Section (Bento Card) -->
<div class="px-gutter -mt-8 relative z-20 md:mt-0 md:px-0">
<div class="bg-surface-container-lowest rounded-xl p-container-margin shadow-[0_4px_24px_rgba(0,17,58,0.08)] ring-1 ring-primary-container/5 flex flex-col gap-md">
<h2 class="font-headline-sm text-headline-sm text-on-surface border-b border-outline-variant/30 pb-sm mb-xs">Data Warga</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-md">
<div class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-on-surface-variant">Nomor Induk Kependudukan (NIK)</span>
<div class="bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant flex items-center gap-sm">
<span class="material-symbols-outlined text-on-surface-variant" data-icon="badge">badge</span>
<span class="font-body-md text-body-md text-on-surface">3171012345670001</span>
</div>
</div>
<div class="flex flex-col gap-xs">
<span class="font-label-sm text-label-sm text-on-surface-variant">Nomor Kartu Keluarga (No. KK)</span>
<div class="bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant flex items-center gap-sm">
<span class="material-symbols-outlined text-on-surface-variant" data-icon="recent_patient">recent_patient</span>
<span class="font-body-md text-body-md text-on-surface">3171012345678901</span>
</div>
</div>
<div class="flex flex-col gap-xs md:col-span-2">
<span class="font-label-sm text-label-sm text-on-surface-variant">Alamat Domisili</span>
<div class="bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant flex items-start gap-sm">
<span class="material-symbols-outlined text-on-surface-variant mt-1" data-icon="home_pin">home_pin</span>
<span class="font-body-md text-body-md text-on-surface">Blok A-12, Perumahan Civic Harmony</span>
</div>
</div>
</div>
</div>
</div>
<!-- Menu List Section (Glassmorphism/Soft Cards) -->
<div class="px-gutter mt-lg mb-xl md:px-0 flex flex-col gap-sm">
<a class="bg-surface-container-lowest rounded-xl p-sm flex items-center justify-between shadow-[0_2px_12px_rgba(0,17,58,0.04)] hover:-translate-y-[2px] transition-transform group" href="#">
<div class="flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-icon="manage_accounts">manage_accounts</span>
</div>
<span class="font-body-md text-body-md text-on-surface font-medium">Ubah Profil</span>
</div>
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
</a>
<a class="bg-surface-container-lowest rounded-xl p-sm flex items-center justify-between shadow-[0_2px_12px_rgba(0,17,58,0.04)] hover:-translate-y-[2px] transition-transform group" href="#">
<div class="flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-icon="diversity_3">diversity_3</span>
</div>
<span class="font-body-md text-body-md text-on-surface font-medium">Anggota Keluarga</span>
</div>
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
</a>
<a class="bg-surface-container-lowest rounded-xl p-sm flex items-center justify-between shadow-[0_2px_12px_rgba(0,17,58,0.04)] hover:-translate-y-[2px] transition-transform group" href="#">
<div class="flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
</div>
<span class="font-body-md text-body-md text-on-surface font-medium">Riwayat Pembayaran IPL</span>
</div>
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
</a>
<a class="bg-surface-container-lowest rounded-xl p-sm flex items-center justify-between shadow-[0_2px_12px_rgba(0,17,58,0.04)] hover:-translate-y-[2px] transition-transform group" href="#">
<div class="flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
<span class="material-symbols-outlined" data-icon="support_agent">support_agent</span>
</div>
<span class="font-body-md text-body-md text-on-surface font-medium">Pusat Bantuan</span>
</div>
<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
</a>
<div class="w-full h-px bg-outline-variant/50 my-sm"></div>
<button class="bg-error-container/20 rounded-xl p-sm flex items-center justify-between hover:bg-error-container/40 transition-colors group">
<div class="flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-error-container text-error flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
</div>
<span class="font-body-md text-body-md text-error font-medium">Keluar</span>
</div>
</button>
</div>
</section>
</main>
<!-- BottomNavBar (Mobile Only) -->
<nav class="md:hidden bg-surface dark:bg-surface-container-lowest text-primary dark:text-primary-fixed-dim font-label-sm text-label-sm docked full-width bottom-0 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shadow-lg fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe">
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors w-16 py-1 rounded-xl" href="#">
<span class="material-symbols-outlined" data-icon="home">home</span>
<span>Home</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors w-16 py-1 rounded-xl" href="#">
<span class="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>
<span>UMKM</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors w-16 py-1 rounded-xl" href="#">
<span class="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
<span>IPL</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors w-16 py-1 rounded-xl" href="#">
<span class="material-symbols-outlined" data-icon="campaign">campaign</span>
<span>News</span>
</a>
<a class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-3 py-1 hover:bg-surface-container-high transition-colors active:scale-90 duration-150 w-16" href="#">
<span class="material-symbols-outlined" data-icon="person" data-weight="fill" style="font-variation-settings: 'FILL' 1;">person</span>
<span class="font-bold">Profile</span>
</a>
</nav>
</body></html>