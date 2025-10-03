document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const contactNumber = document.getElementById("contactNumber").value.trim();
        const age = document.getElementById("age").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await axios.post("/auth/register", {
                firstName,
                lastName,
                email,
                contactNumber,
                age,
                password,
                userType: "User"
            });

            alert("Registration successful!");
            window.location.href = "/auth/login";
        } catch (error) {
            const message = error.response?.data?.message || "Registration failed";
            alert(message);
            console.error("Register error:", message);
        }
    });
});
