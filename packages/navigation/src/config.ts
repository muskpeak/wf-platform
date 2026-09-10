export interface NavItem {
  id: string;
  path: string;
  title: string;
}

export const MAIN_NAV_CONFIG: NavItem[] = [
  { path: "/", title: "首页", id: "home" },
  { path: "/lotto", title: "世界乐透", id: "lotto" },
  { path: "/3d", title: "3D", id: "three_d" },
];

export const BOTTOM_NAV_CONFIG = [
  { path: "/", title: "首页", id: "home", icon: "home" },
  { path: "/lotto", title: "世界乐透", id: "lotto", icon: "world_lotto" },
  { path: "/3d", title: "3D", id: "three_d", icon: "three_d" },
  { path: "/profile", title: "个人中心", id: "profile", icon: "profile" },
];
