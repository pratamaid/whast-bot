/*
 Navicat Premium Data Transfer

 Source Server         : Lokal
 Source Server Type    : MySQL
 Source Server Version : 80030 (8.0.30)
 Source Host           : localhost:3306
 Source Schema         : whatsbot

 Target Server Type    : MySQL
 Target Server Version : 80030 (8.0.30)
 File Encoding         : 65001

 Date: 25/11/2024 19:09:27
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for history
-- ----------------------------
DROP TABLE IF EXISTS `history`;
CREATE TABLE `history`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `session_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of history
-- ----------------------------

-- ----------------------------
-- Table structure for states
-- ----------------------------
DROP TABLE IF EXISTS `states`;
CREATE TABLE `states`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `state_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `state_name`(`state_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of states
-- ----------------------------
INSERT INTO `states` VALUES (1, 'initial', 'Halo Selamat Datang Di BOT, Silahkan masukkan nama anda 😊');
INSERT INTO `states` VALUES (2, 'name', 'Masukkan Nama Anda');
INSERT INTO `states` VALUES (3, 'problem', 'Masukkan Masalah Anda');
INSERT INTO `states` VALUES (4, 'end', 'Anda akan dihubungi oleh teknisi kami, ada yang bisa kami bantu lagi? \\n 1. Ya atau 2. Tidak');
INSERT INTO `states` VALUES (5, 'end_fix', 'Terima kasih telah menghubungi Kami, mohon ditunggu untuk chat dari teknisi kami 😊');
INSERT INTO `states` VALUES (6, 'freeze', 'Jika Freeze, Restart Bos!');
INSERT INTO `states` VALUES (7, 'bsod', 'Jika BlueScreen, Restart Bos!');
INSERT INTO `states` VALUES (8, 'lemot', 'Jika Lemot, beli baru bos!');

-- ----------------------------
-- Table structure for transitions
-- ----------------------------
DROP TABLE IF EXISTS `transitions`;
CREATE TABLE `transitions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `state_from` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_input` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `state_to` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `state_from`(`state_from` ASC) USING BTREE,
  INDEX `state_to`(`state_to` ASC) USING BTREE,
  CONSTRAINT `transitions_ibfk_1` FOREIGN KEY (`state_from`) REFERENCES `states` (`state_name`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `transitions_ibfk_2` FOREIGN KEY (`state_to`) REFERENCES `states` (`state_name`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of transitions
-- ----------------------------
INSERT INTO `transitions` VALUES (1, 'initial', '*', 'problem');
INSERT INTO `transitions` VALUES (2, 'problem', '1', 'freeze');
INSERT INTO `transitions` VALUES (3, 'end', '2', 'end_fix');
INSERT INTO `transitions` VALUES (4, 'end', '*', 'initial');
INSERT INTO `transitions` VALUES (5, 'problem', '2', 'bsod');
INSERT INTO `transitions` VALUES (6, 'problem', '3', 'lemot');
INSERT INTO `transitions` VALUES (7, 'freeze', '*', 'end');
INSERT INTO `transitions` VALUES (8, 'bsod', '*', 'end');
INSERT INTO `transitions` VALUES (9, 'lemot', '*', 'end');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `current_state` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `phone_number`(`phone_number` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
