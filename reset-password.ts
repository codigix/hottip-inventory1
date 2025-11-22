import bcrypt from "bcrypt";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

const resetPassword = async () => {
  const username = process.argv[2] || "sanika";
  const newPassword = process.argv[3] || "sanika@123";

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username))
      .returning();

    if (result.length > 0) {
      console.log(
        `✅ Password reset successfully for user: ${username}`
      );
      console.log(`   New password: ${newPassword}`);
    } else {
      console.log(`❌ User not found: ${username}`);
    }
  } catch (error) {
    console.error("❌ Error resetting password:", error);
  }
};

resetPassword();
