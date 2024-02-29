const user = (req, res, next) => {
    try {
        if (req.user === undefined) {
            return res.status(401).json({error: 'Please authenticate'})
        }
        const role = req.user.role;
        if (role === "ADMIN") {
            return res.status(403).json({error: 'Access is not allowed'})
        }
        next();
    }
    catch (err) {
        res.status(500).json({ 
            message: "Internal Server Error",
            error: err.message
        })
    }
}

module.exports = user;