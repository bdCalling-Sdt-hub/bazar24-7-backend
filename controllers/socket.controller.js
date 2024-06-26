// const Conversation = require("../models/conversation.model");
// const Message = require("../models/message.model");
// const Product = require("../models/product.model");
// const User = require("../models/user.model");

// module.exports = function (io) {
//   io.on("connection", async (socket) => {
//     console.log("A user connected with", socket.id);

//     socket.on("joinRoom", (data) => {
//       socket.join(data?.id);
//     });
//     //Message send
//     socket.on("sendMessage", async (data) => {
//       try {
//         const { message, senderId, productId, receiverId } = data;

//         const checkProduct = await Product.findById(productId);
//         const checkSenderUser = await User.findById(senderId);
//         const checkReceiverUser = await User.findById(receiverId);

//         if (
//           checkProduct === null ||
//           checkSenderUser === null ||
//           checkReceiverUser === null
//         ) {
//           throw new ApiError(404, "Sender, Receiver or ProductId not found");
//         }

//         let conversation = await Conversation.findOne({
//           productId,
//         });

//         if (!conversation) {
//           conversation = await Conversation.create({
//             participants: [senderId, receiverId],
//             productId,
//           });
//         }
//         const newMessage = new Message({
//           senderId,
//           receiverId,
//           productId,
//           message,
//           conversationId: conversation._id,
//         });

//         if (newMessage) {
//           conversation.messages.push(newMessage._id);
//         }
//         await Promise.all([conversation.save(), newMessage.save()]);

//         if (conversation && newMessage) {
//           //@ts-ignore
//           io.to(productId).emit("getMessage", newMessage);
//           // io.to(productId).emit("getMessage", newMessage);
//         }

//         return newMessage;
//       } catch (error) {
//         console.error("An error occurred:", error);
//         // Handle the error appropriately, e.g., send an error response to the client
//         socket.emit("sendMessageError", {
//           error: "An error occurred while sending the message",
//         });
//       }
//     });
//     // const username = socket.handshake.auth.token;
//     // console.log(`User ${username} connected`);
//     //  // Check if the username already exists in connectedUsers array
//     //  if (!connectedUsers.includes(username)) {
//     //     connectedUsers.push(username); // Add the username to the array
//     //     // Emit event to notify all clients about the updated list of online users
//     //     io.emit('updateOnlineUser', connectedUsers);
//     // } else {
//     //     console.log(`User ${username} already connected`);
//     //     socket.disconnect(true);
//     //     return;
//     // }
//     socket.on("disconnect", async () => {
//       console.log("A user disconnected");
//       // Find the index of the disconnected user in connectedUsers array
//       // const index = connectedUsers.indexOf(username);
//       // if (index !== -1) {
//       //     // Remove the user from the array
//       //     connectedUsers.splice(index, 1);
//       //     // Emit event to notify all clients about the updated list of online users
//       //     io.emit('updateOnlineUser', connectedUsers);
//       // }
//       // console.log(connectedUsers)
//       const userId = socket.handshake.auth.token;
//       await User.findByIdAndUpdate(
//         { _id: userId },
//         { $set: { isOnline: "0" } }
//       );
//       socket.broadcast.emit("getOfflineUser", { user_id: userId });
//     });
//     // socket.on('message', (data) => {
//     //     console.log(`Message from ${data.sender}: ${data.message}`);
//     //     const recipientSocket = connectedClients[data.recipient];
//     //     if (recipientSocket) {
//     //         recipientSocket.emit('message', data);
//     //     } else {
//     //         console.log(`Recipient ${data.recipient} is not online`);
//     //     }
//     // });
//     // socket.on('disconnect', () => {
//     //     console.log('A user disconnected');
//     // });
//     // socket.on('startConversation', (data) => {
//     //     console.log(`User ${data.sender} wants to start a conversation with ${data.recipient}`);
//     //     connectedClients[data.sender] = socket;
//     // });
//   });
// };
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

module.exports = function (io) {
  io.on("connection", async (socket) => {
    console.log("A user connected with", socket.id);

    // Join a specific room
    socket.on("joinRoom", (data) => {
      try {
        if (data?.id) {
          socket.join(data.id);
          console.log(`User joined room: ${data.id}`);
        }
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("joinRoomError", {
          error: "An error occurred while joining the room",
        });
      }
    });

    // Handle sending message
    socket.on("sendMessage", async (data) => {
      try {
        const { message, senderId, productId, receiverId } = data;

        // Validate input data
        if (!message || !senderId || !productId || !receiverId) {
          throw new Error("Missing required fields");
        }

        const checkProduct = await Product.findById(productId);
        const checkSenderUser = await User.findById(senderId);
        const checkReceiverUser = await User.findById(receiverId);

        if (!checkProduct || !checkSenderUser || !checkReceiverUser) {
          throw new Error("Sender, Receiver or Product not found");
        }

        let conversation = await Conversation.findOne({ productId });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, receiverId],
            productId,
          });
        }

        const newMessage = new Message({
          senderId,
          receiverId,
          productId,
          message,
          conversationId: conversation._id,
        });

        await newMessage.save();

        if (conversation) {
          conversation.messages.push(newMessage._id);
          await conversation.save();
        }

        // Emit the new message to the room
        io.to(productId).emit("getMessage", newMessage);
      } catch (error) {
        console.error("An error occurred while sending the message:", error);
        socket.emit("sendMessageError", {
          error: "An error occurred while sending the message",
        });
      }
    });

    // Handle user disconnect
    socket.on("disconnect", async () => {
      console.log("A user disconnected");

      try {
        const userId = socket.handshake.auth.token;
        if (userId) {
          await User.findByIdAndUpdate(userId, { $set: { isOnline: "0" } });
          socket.broadcast.emit("getOfflineUser", { user_id: userId });
        }
      } catch (error) {
        console.error("An error occurred during disconnect:", error);
      }
    });
  });
};
