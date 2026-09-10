# WF Platform - Frontend Design Guidelines

> **CRITICAL RULE**: Whenever you are asked to create, modify, or review UI components and pages in this workspace, you MUST strictly adhere to these design specifications. This project relies on a unified, high-quality Mobile-First Web3 aesthetic.

## 1. Design Aesthetic & Overview
The platform (世界彩) uses a modern, clean, light-mode design. It is **Mobile-First**; on PC, it should scale gracefully but maintain a mobile-centric layout (e.g., constrained max-width containers).
- **Style**: Flat, clean, Web3 dashboard style.
- **Depth**: Strictly NO heavy drop shadows. Depth and hierarchy are achieved through subtle background contrasts (Off-white canvas vs. Pure white cards) and extremely light borders.

## 2. Color System (Tailwind Mapping)
- **Primary Brand (Blue)**: Tailwind `blue-600` (`#2563EB`) or `blue-500`. Used for primary action buttons, active bottom navigation icons, and highlighted numbers.
- **Canvas Background**: Tailwind `gray-50` (`#F9FAFB`). The absolute bottom layer of the app.
- **Surface / Cards**: Tailwind `bg-white` (`#FFFFFF`). All content sits on white cards.
- **Primary Text**: Tailwind `gray-900` (`#111827`). Never use pure black (`#000000`).
- **Secondary / Mute Text**: Tailwind `gray-500` (`#6B7280`). Used for labels, descriptions, and inactive states.
- **Borders & Dividers**: Tailwind `gray-100` (`#F3F4F6`) or `gray-200`. Used to separate list items or card edges.

## 3. Shapes & Typography
- **Border Radius**: 
  - Cards and Modals: `rounded-xl` (12px) or `rounded-2xl` (16px).
  - Buttons: **Always Pill-shaped** `rounded-full` (9999px) for primary calls to action.
- **Typography**: 
  - Font: Sans-serif (Inter/System default).
  - Hierarchy relies on font-weight. Use `font-semibold` or `font-bold` for critical data (balances, titles) and `font-normal` for labels.

## 4. Component Rules (shadcn/ui + Tailwind)
- **Buttons**:
  - Primary: `bg-blue-600 text-white rounded-full`.
  - Secondary/Soft: `bg-gray-100 text-gray-900 rounded-full`.
  - Outline: `border border-blue-600 text-blue-600 rounded-full bg-transparent`.
- **Layouts**:
  - Always implement a Bottom Navigation bar for core routing.
  - Wrap the main app view in a mobile-constrained container if viewed on desktop (e.g., `max-w-md mx-auto min-h-screen bg-gray-50`).

## 5. Implementation Workflow
1. Use `shadcn/ui` components from `@wf-platform/uikit` as the foundation.
2. Customize them by passing Tailwind classes via the `className` prop (processed safely by `cn()`).
3. Never use generic/boring HTML elements when a customized UI token is available.
