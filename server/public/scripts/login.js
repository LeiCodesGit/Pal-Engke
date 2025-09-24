document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email-input").value.trim();
        const password = document.getElementById("password-input").value;

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        try {
            const response = await axios.post("/auth/login", {
                email,
                password,
            });

            const user = response.data.user;

            alert("Login successful!");

            // Redirect based on user type
            if (user.userType === "admin") {
                window.location.href = "/admin/adminmenu";
            } else {
                window.location.href = "/home";
            }
        } catch (error) {
            const message = error.response?.data?.message || "Login failed";
            alert(message);
            console.error("Login error:", message);
        }
    });
});
