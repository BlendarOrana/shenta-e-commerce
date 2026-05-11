import { Redirect } from "expo-router";

export default function RootIndex() {
  // Correct path including (app) and (tabs)
  return <Redirect href="/(app)/(tabs)/shop" />;
}