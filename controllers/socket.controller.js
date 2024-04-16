
const User = require("../models/user.model");
module.exports = function (io) {
    const connectedClients = {};
    const connectedUsers = [];
    io.on('connection', async(socket) => {
        console.log('A user connected');

        const userId=socket.handshake.auth.token;
        console.log(userId)

         await User.findByIdAndUpdate({_id:userId},{$set:{isOnline:"1"}});

         socket.broadcast.emit("getOnlineUser",{user_id:userId});

        // socket.on("message", (data) => {
        //     console.log(data)
        // })

     





        // const username = socket.handshake.auth.token;
        // console.log(`User ${username} connected`);

        //  // Check if the username already exists in connectedUsers array
        //  if (!connectedUsers.includes(username)) {
        //     connectedUsers.push(username); // Add the username to the array
        //     // Emit event to notify all clients about the updated list of online users
        //     io.emit('updateOnlineUser', connectedUsers);
        // } else {
        //     console.log(`User ${username} already connected`);
        //     socket.disconnect(true);
        //     return;
        // }





       
       


        socket.on('disconnect', async() => {
            console.log('A user disconnected');
            // Find the index of the disconnected user in connectedUsers array
            // const index = connectedUsers.indexOf(username);
            // if (index !== -1) {
            //     // Remove the user from the array
            //     connectedUsers.splice(index, 1);
            //     // Emit event to notify all clients about the updated list of online users
            //     io.emit('updateOnlineUser', connectedUsers);
            // }
            // console.log(connectedUsers)

            const userId=socket.handshake.auth.token;

            await User.findByIdAndUpdate({_id:userId},{$set:{isOnline:"0"}});

            socket.broadcast.emit("getOfflineUser",{user_id:userId});
        });

        // socket.on('message', (data) => {
        //     console.log(`Message from ${data.sender}: ${data.message}`);
        //     const recipientSocket = connectedClients[data.recipient];
        //     if (recipientSocket) {
        //         recipientSocket.emit('message', data);
        //     } else {
        //         console.log(`Recipient ${data.recipient} is not online`);
        //     }
        // });

        // socket.on('disconnect', () => {
        //     console.log('A user disconnected');
        // });

        // socket.on('startConversation', (data) => {
        //     console.log(`User ${data.sender} wants to start a conversation with ${data.recipient}`);
        //     connectedClients[data.sender] = socket;
        // });
    });
};