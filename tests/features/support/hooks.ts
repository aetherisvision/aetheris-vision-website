import { After } from "@cucumber/cucumber";
import { cleanup } from "@testing-library/react";
import { __resetSearchParams } from "./stubs/next-navigation";

/**
 * Shared teardown for DOM-backed scenarios: unmount any React trees rendered by
 * @testing-library/react and reset the next/navigation search-param stub so
 * scenarios stay isolated from one another.
 */
After(function () {
  cleanup();
  __resetSearchParams();
});
