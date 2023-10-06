"use server";

import {revalidatePath} from "next/cache";
import User from "../models/user.model";
import {connectToDB} from "../mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}
// destucture the params object to solve ordering issue.
export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: Params): Promise<void> {
  try {
    connectToDB();

    // Update the user in the database.
    await User.findOneAndUpdate(
      {id: userId},
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      {upsert: true} // update existing row if found, otherwise insert new row.
    );

    if (path === "/profile/edit") {
      revalidatePath(path); // Revalidate the profile page without waiting for the revalidation period to expire.
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUser(userId: string) {
  try {
    connectToDB();
    return await User.findOne({id: userId});
    // .populate({
    //   path: "communities", Not access yet. TODO: Fix this.
    //   model: "Community",
    // });
  } catch (error: any) {
    throw new Error(`Failed to fetch user>>> ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();
    //Find all threads authored by the user id.
    const threads = await User.findOne({id: userId}).populate({
      path: "threads",
      model: "Thread",
      populate: {
        path: "children",
        model: "Thread",
        populate: {
          path: "author",
          model: "User",
          select: "name image id",
        },
      },
    });

    return threads;
  } catch (error: any) {
    throw new Error(`Failed to fetch user posts>>> ${error.message}`);
  }
}
