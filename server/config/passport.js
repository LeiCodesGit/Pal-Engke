import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
    new GoogleStrategy(
        {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:4000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            // Check if user already exists
            let user = await User.findOne({ email });

            if (!user) {
                // Create new user with Google data
                const newUser = new User({
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                userType: "user",
                googleId: profile.id,
                });
                user = await newUser.save();
            }

            // Continue to login
            return done(null, user);
        } catch (error) {
            console.error("Error in Google Strategy:", error);
            return done(error, null);
        }
        }
    )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});
export default passport;