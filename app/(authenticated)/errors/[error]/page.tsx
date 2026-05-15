"use client";
import { use } from "react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ForbiddenError } from "@/features/errors/forbidden";
import { GeneralError } from "@/features/errors/general-error";
import { MaintenanceError } from "@/features/errors/maintenance-error";
import { NotFoundError } from "@/features/errors/not-found-error";
import { UnauthorisedError } from "@/features/errors/unauthorized-error";

const errorMap: Record<string, React.ComponentType> = {
  unauthorized: UnauthorisedError,
  forbidden: ForbiddenError,
  "not-found": NotFoundError,
  "internal-server-error": GeneralError,
  "maintenance-error": MaintenanceError,
};

export default function ErrorPage({
  params,
}: {
  params: Promise<{ error: string }>;
}) {
  const { error } = use(params);
  const ErrorComponent = errorMap[error] || NotFoundError;

  return (
    <>
      <Header fixed className="border-b">
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <div className="flex-1 [&>div]:h-full">
        <ErrorComponent />
      </div>
    </>
  );
}
