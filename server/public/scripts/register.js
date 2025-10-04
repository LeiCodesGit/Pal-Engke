document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const contactNumber = document.getElementById("contactNumber").value.trim();
        const age = parseInt(document.getElementById("age").value);
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const userType = "user"; // default user type

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Field validation
        if (!firstName || !lastName || !email || !contactNumber || !age || !password || !confirmPassword) {
            alert("All fields are required.");
            return;
        }

        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (!/^\d{11}$/.test(contactNumber)) {
            alert("Contact number must be 11 digits long.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (isNaN(age) || age <= 0) {
            alert("Please enter a valid age.");
            return;
        }

        if (age < 18) {
            alert("You must be at least 18 years old to register.");
            return;
        }

        // Prepare data
        const formData = {
            userType,
            firstName,
            lastName,
            email,
            contactNumber,
            password,
            age
        };

        try {
            const response = await axios.post("/auth/register", formData);

            if (response.status === 201) {
                alert("Registration successful!");
                registerForm.reset();
                window.location.href = "/auth/login";
            }
        } catch (error) {
            const message = error.response?.data?.message || "Registration failed";

            if (error.response?.status === 409 || message.toLowerCase().includes("email")) {
                alert("Email already exists. Please use a different one.");
            } else {
                alert(message);
            }

            console.error("Error details:", error.response?.data || error.message);
        }
    });
});
